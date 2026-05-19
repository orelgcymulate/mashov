import { JwtService } from '@nestjs/jwt';
import { authenticateHandshake } from '../src/modules/calls/ws-auth';

describe('authenticateHandshake', () => {
  const jwt = new JwtService({ secret: 'test-secret' });

  it('returns the user payload when cookie holds a valid JWT', () => {
    const token = jwt.sign({ sub: 'user-1' });
    const user = authenticateHandshake({ cookieHeader: `mashov_session=${token}; other=1` }, jwt);
    expect(user).toEqual({ sub: 'user-1' });
  });

  it('returns the user payload when a token is passed explicitly', () => {
    const token = jwt.sign({ sub: 'user-1' });
    const user = authenticateHandshake({ token }, jwt);
    expect(user).toEqual({ sub: 'user-1' });
  });

  it('prefers the explicit token over the cookie', () => {
    const tokenA = jwt.sign({ sub: 'a' });
    const tokenB = jwt.sign({ sub: 'b' });
    const user = authenticateHandshake({ cookieHeader: `mashov_session=${tokenA}`, token: tokenB }, jwt);
    expect(user).toEqual({ sub: 'b' });
  });

  it('returns null when nothing is provided', () => {
    expect(authenticateHandshake({}, jwt)).toBeNull();
  });

  it('returns null when the session cookie is missing', () => {
    expect(authenticateHandshake({ cookieHeader: 'other=1' }, jwt)).toBeNull();
  });

  it('returns null when the JWT is invalid', () => {
    expect(authenticateHandshake({ cookieHeader: 'mashov_session=garbage' }, jwt)).toBeNull();
    expect(authenticateHandshake({ token: 'garbage' }, jwt)).toBeNull();
  });
});
