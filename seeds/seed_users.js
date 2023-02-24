const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  const salt = await bcrypt.genSalt(10);

  const users = [];

  for (let i = 0; i < 5; i++) {
    const name = `User ${i + 1}`;
    const email = `user${i + 1}@example.com`;
    const password = await bcrypt.hash('password123', salt);
    const status = 1;

    users.push({
      name,
      email,
      password,
      status,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  await knex('users').insert(users);
};
