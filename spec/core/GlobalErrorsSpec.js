describe("GlobalErrors", function() {
  it("calls the added handler on error", function() {
    var fakeGlobal = { onerror: null },
        handler = jasmine.createSpy('errorHandler'),
        errors = new jasmineUnderTest.GlobalErrors(fakeGlobal);

    errors.install();
    errors.pushListener(handler);

    fakeGlobal.onerror('foo');

    expect(handler).toHaveBeenCalledWith('foo');
  });

  it("only calls the most recent handler", function() {
    var fakeGlobal = { onerror: null },
        handler1 = jasmine.createSpy('errorHandler1'),
        handler2 = jasmine.createSpy('errorHandler2'),
        errors = new jasmineUnderTest.GlobalErrors(fakeGlobal);

    errors.install();
    errors.pushListener(handler1);
    errors.pushListener(handler2);

    fakeGlobal.onerror('foo');

    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).toHaveBeenCalledWith('foo');
  });

  it("calls previous handlers when one is removed", function() {
    var fakeGlobal = { onerror: null },
        handler1 = jasmine.createSpy('errorHandler1'),
        handler2 = jasmine.createSpy('errorHandler2'),
        errors = new jasmineUnderTest.GlobalErrors(fakeGlobal);

    errors.install();
    errors.pushListener(handler1);
    errors.pushListener(handler2);

    errors.popListener();

    fakeGlobal.onerror('foo');

    expect(handler1).toHaveBeenCalledWith('foo');
    expect(handler2).not.toHaveBeenCalled();
  });

  it("uninstalls itself, putting back a previous callback", function() {
    var originalCallback = jasmine.createSpy('error'),
        fakeGlobal = { onerror: originalCallback },
        errors = new jasmineUnderTest.GlobalErrors(fakeGlobal);

    expect(fakeGlobal.onerror).toBe(originalCallback);

    errors.install();

    expect(fakeGlobal.onerror).not.toBe(originalCallback);

    errors.uninstall();

    expect(fakeGlobal.onerror).toBe(originalCallback);
  });

  it("rethrows the original error when there is no handler", function() {
    var fakeGlobal = { },
        errors = new jasmineUnderTest.GlobalErrors(fakeGlobal),
        originalError = new Error('nope');

    errors.install();

    try {
      fakeGlobal.onerror(originalError);
    } catch (e) {
      expect(e).toBe(originalError);
    }

    errors.uninstall();
  });

  it("reports uncaughtException in node.js", function() {
    var fakeGlobal = {
          process: {
            on: jasmine.createSpy('process.on'),
            removeListener: jasmine.createSpy('process.removeListener'),
            listeners: jasmine.createSpy('process.listeners').and.returnValue(['foo']),
            removeAllListeners: jasmine.createSpy('process.removeAllListeners')
          }
        },
        handler = jasmine.createSpy('errorHandler'),
        errors = new jasmineUnderTest.GlobalErrors(fakeGlobal);

    errors.install();
    expect(fakeGlobal.process.on).toHaveBeenCalledWith('uncaughtException', jasmine.any(Function));
    expect(fakeGlobal.process.listeners).toHaveBeenCalledWith('uncaughtException');
    expect(fakeGlobal.process.removeAllListeners).toHaveBeenCalledWith('uncaughtException');

    errors.pushListener(handler);

    var addedListener = fakeGlobal.process.on.calls.argsFor(0)[1];
    addedListener(new Error('bar'));

    expect(handler).toHaveBeenCalledWith(new Error('bar'));
    expect(handler.calls.argsFor(0)[0].jasmineMessage).toBe('Uncaught exception: Error: bar');

    errors.uninstall();

    expect(fakeGlobal.process.removeListener).toHaveBeenCalledWith('uncaughtException', addedListener);
    expect(fakeGlobal.process.on).toHaveBeenCalledWith('uncaughtException', 'foo');
  });

  it("reports unhandledRejection in node.js", function() {
    var fakeGlobal = {
          process: {
            on: jasmine.createSpy('process.on'),
            removeListener: jasmine.createSpy('process.removeListener'),
            listeners: jasmine.createSpy('process.listeners').and.returnValue(['foo']),
            removeAllListeners: jasmine.createSpy('process.removeAllListeners')
          }
        },
        handler = jasmine.createSpy('errorHandler'),
        errors = new jasmineUnderTest.GlobalErrors(fakeGlobal);

    errors.install();
    expect(fakeGlobal.process.on).toHaveBeenCalledWith('unhandledRejection', jasmine.any(Function));
    expect(fakeGlobal.process.listeners).toHaveBeenCalledWith('unhandledRejection');
    expect(fakeGlobal.process.removeAllListeners).toHaveBeenCalledWith('unhandledRejection');

    errors.pushListener(handler);

    var addedListener = fakeGlobal.process.on.calls.argsFor(1)[1];
    addedListener(new Error('bar'));

    expect(handler).toHaveBeenCalledWith(new Error('bar'));
    expect(handler.calls.argsFor(0)[0].jasmineMessage).toBe('Unhandled promise rejection: Error: bar');

    errors.uninstall();

    expect(fakeGlobal.process.removeListener).toHaveBeenCalledWith('unhandledRejection', addedListener);
    expect(fakeGlobal.process.on).toHaveBeenCalledWith('unhandledRejection', 'foo');
  });
});
