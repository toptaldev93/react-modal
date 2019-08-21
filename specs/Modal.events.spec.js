/* eslint-env mocha */
import React from "react";
import "should";
import sinon from "sinon";
import Modal from "react-modal";
import {
  moverlay,
  mcontent,
  clickAt,
  mouseDownAt,
  mouseUpAt,
  escKeyDown,
  tabKeyDown,
  renderModal,
  emptyDOM,
  unmountModal
} from "./helper";

export default () => {
  afterEach("Unmount modal", emptyDOM);

  it("should trigger the onAfterOpen callback", () => {
    const afterOpenCallback = sinon.spy();
    renderModal({ isOpen: true, onAfterOpen: afterOpenCallback });
    afterOpenCallback.called.should.be.ok();
  });

  it("should trigger the onAfterClose callback", () => {
    const onAfterCloseCallback = sinon.spy();
    const modal = renderModal({
      isOpen: true,
      onAfterClose: onAfterCloseCallback
    });

    modal.portal.close();

    onAfterCloseCallback.called.should.be.ok();
  });

  it("should not trigger onAfterClose callback when unmounting a closed modal", () => {
    const onAfterCloseCallback = sinon.spy();
    renderModal({ isOpen: false, onAfterClose: onAfterCloseCallback });
    unmountModal();
    onAfterCloseCallback.called.should.not.be.ok();
  });

  it("should trigger onAfterClose callback when unmounting an opened modal", () => {
    const onAfterCloseCallback = sinon.spy();
    renderModal({ isOpen: true, onAfterClose: onAfterCloseCallback });
    unmountModal();
    onAfterCloseCallback.called.should.be.ok();
  });

  it("keeps focus inside the modal when child has no tabbable elements", () => {
    let tabPrevented = false;
    const modal = renderModal({ isOpen: true }, "hello");
    const content = mcontent(modal);
    document.activeElement.should.be.eql(content);
    tabKeyDown(content, {
      preventDefault() {
        tabPrevented = true;
      }
    });
    tabPrevented.should.be.eql(true);
  });

  it("handles case when child has no tabbable elements", () => {
    const modal = renderModal({ isOpen: true }, "hello");
    const content = mcontent(modal);
    tabKeyDown(content);
    document.activeElement.should.be.eql(content);
  });

  it("traps tab in the modal on shift + tab", () => {
    const topButton = <button>top</button>;
    const bottomButton = <button>bottom</button>;
    const modalContent = (
      <div>
        {topButton}
        {bottomButton}
      </div>
    );
    const modal = renderModal({ isOpen: true }, modalContent);
    const content = mcontent(modal);
    tabKeyDown(content, { shiftKey: true });
    document.activeElement.textContent.should.be.eql("bottom");
  });

  describe("shouldCloseOnEsc", () => {
    context("when true", () => {
      it("should close on Esc key event", () => {
        const requestCloseCallback = sinon.spy();
        const modal = renderModal({
          isOpen: true,
          shouldCloseOnEsc: true,
          onRequestClose: requestCloseCallback
        });
        escKeyDown(mcontent(modal));
        requestCloseCallback.called.should.be.ok();
        // Check if event is passed to onRequestClose callback.
        const event = requestCloseCallback.getCall(0).args[0];
        event.should.be.ok();
      });
    });

    context("when false", () => {
      it("should not close on Esc key event", () => {
        const requestCloseCallback = sinon.spy();
        const modal = renderModal({
          isOpen: true,
          shouldCloseOnEsc: false,
          onRequestClose: requestCloseCallback
        });
        escKeyDown(mcontent(modal));
        requestCloseCallback.called.should.be.false;
      });
    });
  });

  describe("shouldCloseOnoverlayClick", () => {
    it("when false, click on overlay should not close", () => {
      const requestCloseCallback = sinon.spy();
      const modal = renderModal({
        isOpen: true,
        shouldCloseOnOverlayClick: false
      });
      const overlay = moverlay(modal);
      clickAt(overlay);
      requestCloseCallback.called.should.not.be.ok();
    });

    it("when true, click on overlay must close", () => {
      const requestCloseCallback = sinon.spy();
      const modal = renderModal({
        isOpen: true,
        shouldCloseOnOverlayClick: true,
        onRequestClose: requestCloseCallback
      });
      clickAt(moverlay(modal));
      requestCloseCallback.called.should.be.ok();
    });

    it("overlay mouse down and content mouse up, should not close", () => {
      const requestCloseCallback = sinon.spy();
      const modal = renderModal({
        isOpen: true,
        shouldCloseOnOverlayClick: true,
        onRequestClose: requestCloseCallback
      });
      mouseDownAt(moverlay(modal));
      mouseUpAt(mcontent(modal));
      requestCloseCallback.called.should.not.be.ok();
    });

    it("content mouse down and overlay mouse up, should not close", () => {
      const requestCloseCallback = sinon.spy();
      const modal = renderModal({
        isOpen: true,
        shouldCloseOnOverlayClick: true,
        onRequestClose: requestCloseCallback
      });
      mouseDownAt(mcontent(modal));
      mouseUpAt(moverlay(modal));
      requestCloseCallback.called.should.not.be.ok();
    });
  });

  it("should not stop event propagation", () => {
    let hasPropagated = false;
    const modal = renderModal({
      isOpen: true,
      shouldCloseOnOverlayClick: true
    });
    window.addEventListener("click", () => {
      hasPropagated = true;
    });
    moverlay(modal).dispatchEvent(new MouseEvent("click", { bubbles: true }));
    hasPropagated.should.be.ok();
  });

  it("verify event passing on overlay click", () => {
    const requestCloseCallback = sinon.spy();
    const modal = renderModal({
      isOpen: true,
      shouldCloseOnOverlayClick: true,
      onRequestClose: requestCloseCallback
    });
    // click the overlay
    clickAt(moverlay(modal), {
      // Used to test that this was the event received
      fakeData: "ABC"
    });
    requestCloseCallback.called.should.be.ok();
    // Check if event is passed to onRequestClose callback.
    const event = requestCloseCallback.getCall(0).args[0];
    event.should.be.ok();
  });

  it("on nested modals, only the topmost should handle ESC key.", () => {
    const requestCloseCallback = sinon.spy();
    const innerRequestCloseCallback = sinon.spy();
    let innerModal = null;
    let innerModalRef = ref => {
      innerModal = ref;
    };

    renderModal(
      {
        isOpen: true,
        onRequestClose: requestCloseCallback
      },
      <Modal
        isOpen
        onRequestClose={innerRequestCloseCallback}
        ref={innerModalRef}
      >
        <span>Test</span>
      </Modal>
    );

    const content = mcontent(innerModal);
    escKeyDown(content);
    innerRequestCloseCallback.called.should.be.ok();
    requestCloseCallback.called.should.not.be.ok();
  });
};
