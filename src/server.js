import Logger from './lib/logger';
import app from './app';

const PORT = 3333;

app.listen(PORT, (err) => {
  if (err) {
    Logger.error(err);
  } else {
    Logger.connection(`Server running on port: ${PORT}`);
  }
});
