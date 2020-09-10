import jwt from 'jsonwebtoken';
import * as Yup from 'yup';
import bcrypt from 'bcryptjs';
import connection from '../../database/connection';
import authConfig from '../../config/auth';
import Logger from '../../lib/logger';

class SessionController {
  async store(req, res) {
    Logger.header('controller - session - store');

    const { email, password } = req.body;
    Logger.log(`[${email}][${password}]`);

    /**
     * Inputs validator
     */
    const schema = Yup.object().shape({
      email: Yup.string().email().required(),
      password: Yup.string().min(6).required(),
    });

    if (!(await schema.isValid(req.body))) {
      Logger.error('Validation failed');
      return res.status(400).json({ error: 'Validation failed' });
    }

    /**
     * Verifies if the email is already in use.
     */
    const users = await connection('users').select('users.*');
    const [userExists] = users.filter((user) => user.email === email);

    if (!userExists) {
      Logger.error('User not found');
      return res.json({ error: 'User not found' });
    }

    /**
     * Compares both inputed password and stored password
     */
    const checkPassword = (password) => {
      return bcrypt.compare(password, userExists.password_hash);
    };

    if (!(await checkPassword(password))) {
      Logger.error('Password does not match');
      return res.status(401).json({ error: 'Password does not match' });
    }

    Logger.success('[200]');
    return res.json({
      user: {
        id: userExists.id,
        name: userExists.name,
        email,
      },
      token: jwt.sign({ id: userExists.id }, authConfig.secret, {
        expiresIn: authConfig.expiresIn,
      }),
    });
  }
}

export default new SessionController();
