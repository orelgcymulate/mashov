import { JwtService } from '@nestjs/jwt';
import { authenticateHandshake } from '../src/modules/calls/ws-auth';

describe('authenticateHandshake', () => {
  const jwt = new JwtService({ secret: 'test-secret' });

  it('returns the user payload when cookie holds a valid JWT', () => {
    const token = jwt.sign({ sub: 'user-1' });
    const user = authenticateHandshake(`mashov_session=${token}; other=1`, jwt);
    expect(user).toEqual({ sub: 'user-1' });
  });

  it('returns null when no cookie header', () => {
    expect(authenticateHandshake(undefined, jwt)).toBeNull();
  });

  it('returns null when the session cookie is missing', () => {
    expect(authenticateHandshake('other=1', jwt)).toBeNull();
  });

  it('returns null when the JWT is invalid', () => {
    expect(authenticateHandshake('mashov_session=garbage', jwt)).toBeNull();
  });
});
