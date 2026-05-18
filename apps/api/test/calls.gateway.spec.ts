import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { io as ioc, Socket as ClientSocket } from 'socket.io-client';
import { CallsModule } from '../src/modules/calls/calls.module';
import { AuthModule } from '../src/modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { CALL_EVENTS } from '@mashov/shared';

describe('CallsGateway (e2e)', () => {
  let app: INestApplication;
  let url: string;
  let cookie: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        AuthModule,
        CallsModule,
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useWebSocketAdapter(new IoAdapter(app));
    await app.listen(0);
    const addr = app.getHttpServer().address();
    url = `http://localhost:${addr.port}`;
    const jwt = app.get(JwtService);
    cookie = `mashov_session=${jwt.sign({ sub: 'family-1' })}`;
  }, 30000);

  afterAll(async () => { await app.close(); });

  function connect(role: 'tablet' | 'phone'): Promise<ClientSocket> {
    return new Promise((resolve, reject) => {
      const s = ioc(url, {
        path: '/api/calls/socket.io',
        transports: ['websocket'],
        extraHeaders: { cookie },
        query: { role },
      });
      s.on('connect', () => resolve(s));
      s.on('connect_error', reject);
    });
  }

  it('rings the tablet when the phone initiates', async () => {
    const tablet = await connect('tablet');
    const phone = await connect('phone');

    const incoming = new Promise<any>((resolve) =>
      tablet.once(CALL_EVENTS.incoming, resolve),
    );
    const outgoing = new Promise<any>((resolve) =>
      phone.once(CALL_EVENTS.outgoing, resolve),
    );

    phone.emit(CALL_EVENTS.initiate, { kidId: '507f1f77bcf86cd799439011' });

    const [inc, out] = await Promise.all([incoming, outgoing]);
    expect(inc.callId).toEqual(out.callId);
    expect(inc.kidId).toBe('507f1f77bcf86cd799439011');

    tablet.close();
    phone.close();
  }, 10000);

  it('routes accept/decline back to the caller', async () => {
    const tablet = await connect('tablet');
    const phone = await connect('phone');

    const ringing = new Promise<{ callId: string }>((resolve) =>
      tablet.once(CALL_EVENTS.incoming, resolve),
    );
    phone.emit(CALL_EVENTS.initiate, { kidId: '507f1f77bcf86cd799439011' });
    const { callId } = await ringing;

    const accepted = new Promise<any>((resolve) =>
      phone.once(CALL_EVENTS.accepted, resolve),
    );
    tablet.emit(CALL_EVENTS.accept, { callId });
    expect((await accepted).callId).toBe(callId);

    tablet.close();
    phone.close();
  }, 10000);

  it('rejects calls when no tablet is online', async () => {
    const phone = await connect('phone');

    const ended = new Promise<any>((resolve) =>
      phone.once(CALL_EVENTS.ended, resolve),
    );
    phone.emit(CALL_EVENTS.initiate, { kidId: '507f1f77bcf86cd799439011' });
    expect((await ended).reason).toBe('no_tablet');

    phone.close();
  }, 10000);
});
