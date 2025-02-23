import { EntityOptions as TypeEntityOptions } from 'typeorm';
import { EntityOptions as MikroEntityOptions } from "@mikro-orm/core";
import { ConstructorType } from "../../crud/crud.helper";

/**
 * Options for defining MikroORM entities.
 *
 * @template T - Type of the entity.
 */
export type MikroOrmEntityOptions<T> = MikroEntityOptions<T> & {
    /**
     * Optional function returning the repository constructor.
     */
    mikroOrmRepository?: () => ConstructorType;
};

/**
 * Options for TypeORM entities.
 */
export type TypeOrmEntityOptions = TypeEntityOptions & {
    /**
     * Optional function returning the repository constructor.
     */
    typeOrmRepository?: () => ConstructorType;
};
