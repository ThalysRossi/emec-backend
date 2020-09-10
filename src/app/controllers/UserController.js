import * as Yup from 'yup';
import bcrypt from 'bcryptjs';

import connection from '../../database/connection';
import Logger from '../../lib/logger';

class UserController {
  async store(req, res) {
    Logger.header('controller - user - store');

    const { name, email, password } = req.body;
    Logger.log(`[${name}][${email}][${password}]`);

    /**
     * Inputs validator
     */
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string().email().required(),
      password: Yup.string().required().min(6),
    });

    if (!(await schema.isValid(req.body))) {
      Logger.error('Validation failed');
      return res.status(400).json({ error: 'Validation failed' });
    }

    /**
     * Checks if the user already exists
     */
    const [userExists] = await connection('users')
      .select('users.*')
      .where({ email });

    if (userExists) {
      Logger.error('User already exists');
      return res.status(400).json({ error: 'User already exists' });
    }

    /**
     * Encrypts the password
     */
    const hashedPassword = await bcrypt.hash(password, 8);

    const user = {
      name,
      email,
      password_hash: hashedPassword,
    };

    /**
     * Inserts user into database
     */
    const [newUserId] = await connection('users').insert(user, ['id']);

    const newUser = {
      id: newUserId,
      ...user,
    };

    Logger.success('[200]');
    return res.json(newUser);
  }

  async update(req, res) {
    Logger.header('controller - user - update');

    const { name, email, oldPassword, password, confirmPassword } = req.body;
    Logger.header(
      `[${name}][${email}][${oldPassword}][${password}][${confirmPassword}]`
    );

    /**
     * Inputs validator
     */
    const schema = Yup.object().shape({
      name: Yup.string(),
      emai: Yup.string().email(),
      oldPassword: Yup.string().min(6),
      password: Yup.string()
        .min(6)
        .when('oldPassword', (oldPassword, field) =>
          oldPassword ? field.required() : field
        ),
      confirmPassword: Yup.string().when('password', (password, field) =>
        password ? field.required().oneOf([Yup.ref('password')]) : field
      ),
    });

    if (!(await schema.isValid(req.body))) {
      Logger.error('Validation failed');
      return res.status(400).json({ error: 'Validation failed' });
    }

    const users = await connection('users').select('users.*');
    const [userExists] = users.filter((user) => user.id === req.userId);

    /**
     * Checks if the email is already in the database
     */
    if (email) {
      const [emailExists] = users.filter((user) => user.email === email);
      if (emailExists.email === email) {
        Logger.error('Email already in use');
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    const checkPassword = (password) => {
      return bcrypt.compare(password, userExists.password_hash);
    };

    const hashedPassword = password
      ? await bcrypt.hash(password, 8)
      : userExists.password_hash;

    if (oldPassword && !(await checkPassword(oldPassword))) {
      Logger.error('Password does not match');
      return res.status(401).json({ error: 'Password does not match' });
    }

    const user = {
      name: name || userExists.name,
      email: email || userExists.email,
      password_hash: hashedPassword,
    };

    await connection('users').update(user).where({ id: req.userId });

    Logger.success('[200]');
    return res.json({
      id: req.userId,
      ...user,
    });
  }
}

export default new UserController();
