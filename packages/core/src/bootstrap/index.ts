// import * as csurf from 'csurf';
import { ConflictException, INestApplication, Type } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as Sentry from '@sentry/node';
import { useContainer } from 'class-validator';
import * as expressSession from 'express-session';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';
import * as helmet from 'helmet';
import * as chalk from 'chalk';
import { join } from 'path';
import { urlencoded, json } from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { EntitySubscriberInterface } from 'typeorm';
import { IPluginConfig } from '@gauzy/common';
import { getConfig, setConfig, environment as env } from '@gauzy/config';
import { getEntitiesFromPlugins } from '@gauzy/plugin';
import tracer from './tracer';
import { SentryService } from '../core/sentry/ntegral';
import { coreEntities } from '../core/entities';
import { coreSubscribers } from '../core/entities/subscribers';
import { AppService } from '../app.service';
import { AppModule } from '../app.module';
import { AuthGuard } from '../shared/guards';
import { SharedModule } from './../shared/shared.module';

export async function bootstrap(pluginConfig?: Partial<IPluginConfig>): Promise<INestApplication> {
	console.time('Application Bootstrap Time');

	if (process.env.OTEL_ENABLED === 'true') {
		// Start tracing using Signoz first
		tracer.start();
		console.log('OTEL/Signoz Tracing started');
	} else {
		console.log('OTEL/Signoz Tracing not enabled');
	}

	const config = await registerPluginConfig(pluginConfig);

	const { BootstrapModule } = await import('./bootstrap.module');

	const app = await NestFactory.create<NestExpressApplication>(BootstrapModule, {
		logger: ['log', 'error', 'warn', 'debug', 'verbose'],
		bufferLogs: true
	});

	// Enable Express behind proxies (https://expressjs.com/en/guide/behind-proxies.html)
	app.set('trust proxy', true);

	// Starts listening for shutdown hooks
	app.enableShutdownHooks();

	// This will lock all routes and make them accessible by authenticated users only.
	const reflector = app.get(Reflector);
	app.useGlobalGuards(new AuthGuard(reflector));

	// Assuming `env` contains the environment configuration, including Sentry DSN
	const { sentry } = env;

	// Initialize Sentry if the DSN is available
	if (sentry && sentry.dsn) {
		// Attach the Sentry logger to the app
		app.useLogger(app.get(SentryService));

		// NOTE: possible below is not needed because already included inside SentryService constructor

		process.on('uncaughtException', (error) => {
			console.error('Uncaught Exception Handler in Bootstrap:', error);
			Sentry.captureException(error);
			Sentry.flush(3000).then(() => {
				process.exit(1);
			});
		});

		process.on('unhandledRejection', (reason, promise) => {
			console.error('Unhandled Rejection at:', promise, 'reason:', reason);
			Sentry.captureException(reason);
		});
	} else {
		process.on('uncaughtException', (error) => {
			console.error('Uncaught Exception Handler in Bootstrap:', error);

			setTimeout(() => {
				process.exit(1);
			}, 3000);
		});

		process.on('unhandledRejection', (reason, promise) => {
			console.error('Unhandled Rejection at:', promise, 'reason:', reason);
		});
	}

	app.use(json({ limit: '50mb' }));
	app.use(urlencoded({ extended: true, limit: '50mb' }));

	app.enableCors({
		origin: '*',
		methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
		credentials: true,
		allowedHeaders:
			'Authorization, Language, Tenant-Id, Organization-Id, X-Requested-With, X-Auth-Token, X-HTTP-Method-Override, Content-Type, Content-Language, Accept, Accept-Language, Observe'
	});

	// TODO: enable csurf is not good idea because it was deprecated.
	// Maybe review https://github.com/Psifi-Solutions/csrf-csrf as alternative?
	// As explained on the csurf middleware page https://github.com/expressjs/csurf#csurf,
	// the csurf module requires either a session middleware or cookie-parser to be initialized first.
	// app.use(csurf());

	// We use sessions for Passport Auth
	// For production we use RedisStore
	// https://github.com/tj/connect-redis

	let redisWorked = false;

	console.log('REDIS_ENABLED: ', process.env.REDIS_ENABLED);

	if (process.env.REDIS_ENABLED === 'true') {
		try {
			const url =
				process.env.REDIS_URL ||
				(process.env.REDIS_TLS === 'true'
					? `rediss://${process.env.REDIS_USER}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
					: `redis://${process.env.REDIS_USER}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);

			console.log('REDIS_URL: ', url);

			let host, port, username, password;

			const isTls = url.startsWith('rediss://');

			// Removing the protocol part
			let authPart = url.split('://')[1];

			// Check if the URL contains '@' (indicating the presence of username/password)
			if (authPart.includes('@')) {
				// Splitting user:password and host:port
				let [userPass, hostPort] = authPart.split('@');
				[username, password] = userPass.split(':');
				[host, port] = hostPort.split(':');
			} else {
				// If there is no '@', it means there is no username/password
				[host, port] = authPart.split(':');
			}

			port = parseInt(port);

			const redisConnectionOptions = {
				url: url,
				username: username,
				password: password,
				isolationPoolOptions: {
					min: 10,
					max: 100
				},
				socket: {
					tls: isTls,
					host: host,
					port: port,
					passphrase: password,
					rejectUnauthorized: process.env.NODE_ENV === 'production'
				}
			};

			const redisClient = createClient(redisConnectionOptions)
				.on('error', (err) => {
					console.log('Redis Client Error: ', err);
				})
				.on('connect', () => {
					console.log('Redis Client Connected');
				})
				.on('ready', () => {
					console.log('Redis Client Ready');
				})
				.on('reconnecting', () => {
					console.log('Redis Client Reconnecting');
				})
				.on('end', () => {
					console.log('Redis Client End');
				});

			// connecting to Redis
			await redisClient.connect();

			// ping Redis
			const res = await redisClient.ping();
			console.log('Redis Client Sessions Ping: ', res);

			const redisStore = new RedisStore({
				client: redisClient,
				prefix: env.production ? 'gauzyprodsess:' : 'gauzydevsess:'
			});

			app.use(
				expressSession({
					store: redisStore,
					secret: env.EXPRESS_SESSION_SECRET,
					resave: false, // required: force lightweight session keep alive (touch)
					saveUninitialized: true
					// cookie: { secure: true } // TODO
				})
			);

			redisWorked = true;
		} catch (error) {
			console.log(error);
		}
	}

	if (!redisWorked) {
		app.use(
			// this runs in memory, so we lose sessions on restart of server/pod
			expressSession({
				secret: env.EXPRESS_SESSION_SECRET,
				resave: true, // we use this because Memory store does not support 'touch' method
				saveUninitialized: true
				// cookie: { secure: true } // TODO
			})
		);
	}

	app.use(helmet());
	const globalPrefix = 'api';
	app.setGlobalPrefix(globalPrefix);

	const service = app.select(AppModule).get(AppService);
	await service.seedDBIfEmpty();

	const options = new DocumentBuilder().setTitle('Gauzy API').setVersion('1.0').addBearerAuth().build();

	const document = SwaggerModule.createDocument(app, options);
	SwaggerModule.setup('swg', app, document);

	let { port, host } = config.apiConfigOptions;
	if (!port) {
		port = 3000;
	}
	if (!host) {
		host = '0.0.0.0';
	}

	console.log(chalk.green(`Configured Host: ${host}`));
	console.log(chalk.green(`Configured Port: ${port}`));

	console.log(chalk.green(`Swagger UI available at http://${host}:${port}/swg`));

	/**
	 * Dependency injection with class-validator
	 */
	useContainer(app.select(SharedModule), { fallbackOnErrors: true });

	// Configure Atlassian Connect Express
	// const addon = ac(express());
	// app.use(addon.middleware());

	await app.listen(port, host, () => {
		const message = `Listening at http://${host}:${port}/${globalPrefix}`;
		console.log(chalk.magenta(message));
		// Send message to parent process (desktop app)
		if (process.send) {
			process.send(message);
		}
		// Execute Seed For Demo Server
		if (env.demo) {
			service.executeDemoSeed();
		}
	});

	console.timeEnd('Application Bootstrap Time');
	return app;
}

/**
 * Setting the global config must be done prior to loading the Bootstrap Module.
 */
export async function registerPluginConfig(pluginConfig: Partial<IPluginConfig>) {
	if (Object.keys(pluginConfig).length > 0) {
		setConfig(pluginConfig);
	}

	/**
	 * Configure migration settings
	 */
	setConfig({
		dbConnectionOptions: {
			...getMigrationsSetting()
		}
	});

	console.log(chalk.green(`DB Config: ${JSON.stringify(getConfig().dbConnectionOptions)}`));

	/**
	 * Registered core & plugins entities
	 */
	const entities = await registerAllEntities(pluginConfig);
	setConfig({
		dbConnectionOptions: {
			entities,
			subscribers: coreSubscribers as Array<Type<EntitySubscriberInterface>>
		},
		dbMikroOrmConnectionOptions: {
			entities,
		}
	});

	const registeredConfig = getConfig();
	return registeredConfig;
}

/**
 * Register entities from core and plugin configurations.
 * @param pluginConfig The plugin configuration.
 * @returns An array of registered entity types.
 */
export async function registerAllEntities(
	pluginConfig: Partial<IPluginConfig>
): Promise<Array<Type<any>>> {
	try {
		const coreEntitiesList = coreEntities as Array<Type<any>>;
		const pluginEntitiesList = getEntitiesFromPlugins(pluginConfig.plugins);

		for (const pluginEntity of pluginEntitiesList) {
			const entityName = pluginEntity.name;

			if (coreEntitiesList.some((entity) => entity.name === entityName)) {
				throw new ConflictException({ message: `Error: ${entityName} conflicts with default entities.` });
			} else {
				coreEntitiesList.push(pluginEntity);
			}
		}

		return coreEntitiesList;
	} catch (error) {
		console.error('Error registering entities:', error);
		throw error;
	}
}

/**
 * GET migrations directory & CLI paths.
 *
 * @returns Object containing migrations and CLI paths.
 */
export function getMigrationsSetting() {
	// Consider removing this debug statement in the final implementation
	console.log(`Reporting __dirname: ${__dirname}`);

	// Define dynamic paths for migrations and CLI
	const migrationsPath = join(__dirname, '../database/migrations/*{.ts,.js}');
	const cliMigrationsDir = join(__dirname, '../../src/database/migrations');

	return {
		migrations: [migrationsPath],
		cli: {
			migrationsDir: cliMigrationsDir
		}
	};
}
