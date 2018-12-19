
import build from './build';

describe('build', () => {

  it('works', async () => {
    await build({
      debug: true,
      src: 'test',
    });
  });

});
