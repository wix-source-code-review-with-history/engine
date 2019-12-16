import { createDisposables } from '@wixc3/engine-test-kit/src/disposables';

import { expect } from 'chai';
import { waitFor } from 'promise-assist';
import { spy } from 'sinon';
import { ManagedIframe } from '../src/com/managed-iframe';

describe('Managed Iframe', () => {
    const disposables = createDisposables();
    afterEach(disposables.dispose);

    const createIframe = (): HTMLIFrameElement => {
        const iframe = document.createElement('iframe');
        disposables.add(() => iframe.remove());
        document.body.appendChild(iframe);
        return iframe;
    };

    it('supports updating hash params when communicating with iframe', async () => {
        const host = createIframe();

        const managedIframe = new ManagedIframe(host);
        expect(await managedIframe.getHashParams()).to.eq(undefined);
        const hashParams = {
            test: 'test'
        };

        managedIframe.updateHashParams(hashParams);

        await waitFor(async () => {
            const deserializedHash = await managedIframe.getHashParams();
            expect(deserializedHash).to.deep.equal(hashParams);
        });
    });

    it('triggers hashupdate event when changing hash params', async () => {
        const onHashChange = spy();
        const host = createIframe();
        const managedIframe = new ManagedIframe(host);

        managedIframe.onHashChange(onHashChange);

        managedIframe.updateHashParams({
            test: 'test'
        });

        await waitFor(async () => {
            expect(onHashChange.callCount).to.eq(1);
        });
    });
});
