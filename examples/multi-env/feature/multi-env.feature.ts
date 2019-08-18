import { COM, Environment, Feature, Service, SingleEndpointContextualEnvironment } from '@wixc3/engine-core';

export const mainEnv = new Environment('main', 'window', 'single');
const workerEnv = new Environment('worker', 'worker', 'single');
const nodeEnv = new Environment('node', 'node', 'single');
export const processingEnv = new SingleEndpointContextualEnvironment('processing', [workerEnv, nodeEnv]);

export interface IEchoService {
    echo: (s: string) => string;
}

export interface INameProvider {
    name: () => string;
}

export default new Feature({
    id: 'contextual-environment-test',
    dependencies: [COM],
    api: {
        echoService: Service.withType<IEchoService>()
            .defineEntity(processingEnv)
            .allowRemoteAccess()
    },
    context: {
        processingContext: processingEnv.withContext<INameProvider>()
    }
});
