import { CallsService } from '../src/modules/calls/calls.service';

describe('CallsService', () => {
  let svc: CallsService;
  beforeEach(() => { svc = new CallsService(); });

  it('tracks tablet and phone sockets per user', () => {
    svc.registerSocket('u1', 'tablet', 's-tab');
    svc.registerSocket('u1', 'phone', 's-phone');

    expect(svc.tabletSocketFor('u1')).toBe('s-tab');
    expect(svc.phoneSocketsFor('u1')).toEqual(['s-phone']);
  });

  it('drops sockets on unregister', () => {
    svc.registerSocket('u1', 'tablet', 's-tab');
    svc.unregisterSocket('s-tab');
    expect(svc.tabletSocketFor('u1')).toBeNull();
  });

  it('starts a call and resolves caller/callee sockets', () => {
    svc.registerSocket('u1', 'tablet', 's-tab');
    svc.registerSocket('u1', 'phone', 's-phone');

    const call = svc.startCall({ userId: 'u1', callerSocketId: 's-phone', kidId: 'k1' });

    expect(call.id).toBeDefined();
    expect(call.calleeSocketId).toBe('s-tab');
    expect(call.callerSocketId).toBe('s-phone');
    expect(svc.callById(call.id)).toEqual(call);
  });

  it('refuses to start a call when no tablet is online', () => {
    svc.registerSocket('u1', 'phone', 's-phone');
    expect(() =>
      svc.startCall({ userId: 'u1', callerSocketId: 's-phone', kidId: 'k1' }),
    ).toThrow('no_tablet');
  });

  it('ends a call and forgets it', () => {
    svc.registerSocket('u1', 'tablet', 's-tab');
    svc.registerSocket('u1', 'phone', 's-phone');
    const call = svc.startCall({ userId: 'u1', callerSocketId: 's-phone', kidId: 'k1' });

    svc.endCall(call.id);
    expect(svc.callById(call.id)).toBeNull();
  });
});
