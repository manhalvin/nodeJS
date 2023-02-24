/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable('users', function (table) {
        table.increments('id').primary();
        table.string('name');
        table.string('email').unique().notNullable();
        table.string('password').notNullable();
        table.integer('status').notNullable();
        table.text('file_name').nullable();
        table.text('file_mimetype').nullable();
        table.text('file_size').nullable();
        table.text('file_path').nullable();
        table.enum('role', ['admin','user']).defaultTo('user', options={}).nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTable('users');
};
