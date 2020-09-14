import managedFeature from './managed.feature';
import { devServerEnv, ServerListeningParams } from './dev-server.feature';
import type { IProcessMessage, IFeatureMessagePayload, IFeatureTarget, IPortMessage } from '@wixc3/engine-scripts';

managedFeature.setup(
    devServerEnv,
    (
        _,
        {
            buildFeature: {
                serverListeningHandlerSlot,
                devServerActions: { runFeature, closeFeature, getMetrics, close: closeServer },
            },
        }
    ) => {
        const processListener = async ({ id, payload }: IProcessMessage<unknown>) => {
            if (process.send) {
                if (id === 'run-feature') {
                    const responsePayload = await runFeature(payload as Required<IFeatureTarget>);
                    process.send({ id: 'feature-initialized', payload: responsePayload });
                }
                if (id === 'close-feature') {
                    await closeFeature(payload as IFeatureMessagePayload);
                    process.send({ id: 'feature-closed' });
                }
                if (id === 'server-disconnect') {
                    await closeServer();
                    // eslint-disable-next-line @typescript-eslint/no-misused-promises
                    process.off('message', processListener);
                    process.send({ id: 'server-disconnected' });
                }
                if (id === 'metrics-request') {
                    process.send({
                        id: 'metrics-response',
                        payload: getMetrics(),
                    });
                }
            }
        };

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        process.on('message', processListener);

        serverListeningHandlerSlot.register(({ port }: ServerListeningParams) => {
            if (process.send) {
                process.send({ id: 'port-request', payload: { port } } as IProcessMessage<IPortMessage>);
            }
        });
    }
);
