import { fork } from 'child_process';
import { ForkedProcess, ICommunicationMessage, isEnvironmentPortMessage, RemoteProcess } from '../src';

export interface IStartRemoteNodeEnvironmentOptions {
    port: number;
    inspect?: boolean;
}

export async function startRemoteNodeEnvironment(
    entryFilePath: string,
    { inspect, port }: IStartRemoteNodeEnvironmentOptions
) {
    // Roman: add this lines after worker threads will be debuggable
    // the current behavior should be a fallback

    // try {
    // const WorkerThreadsModule = await import('worker_threads');
    // return new RemoteNodeEnvironment(new WorkerThreadsModule.Worker(entityFilePath, {}));
    // } catch {
    const execArgv = inspect ? ['--inspect'] : [];
    const childProc = fork(entryFilePath, ['remote', '-p', `${port}`], { execArgv });
    await new Promise(res => {
        childProc.once('message', res);
    });
    // tslint:disable-next-line: no-console
    childProc.on('error', console.error);
    // }
    return new RemoteNodeEnvironment(new ForkedProcess(childProc));
}

export class RemoteNodeEnvironment {
    private messageHandlers = new Set<(message: ICommunicationMessage) => void>();

    constructor(private childEnv: RemoteProcess) {}

    public async getRemotePort(): Promise<number> {
        return new Promise(async resolve => {
            this.subscribe(message => {
                if (isEnvironmentPortMessage(message)) {
                    resolve(message.port);
                }
            });
            this.postMessage({ id: 'port-request' });
        });
    }

    public subscribe(handler: (message: ICommunicationMessage) => void) {
        this.messageHandlers.add(handler);
        this.childEnv.on('message', handler);
    }

    public unsubscribe(handler: (message: ICommunicationMessage) => void) {
        this.messageHandlers.delete(handler);
        this.childEnv.off('message', handler);
    }

    public postMessage(message: ICommunicationMessage) {
        this.childEnv.postMessage(message);
    }

    public dispose() {
        for (const handler of this.messageHandlers) {
            this.childEnv.off('message', handler);
        }
        this.messageHandlers.clear();
        if (this.childEnv && this.childEnv.terminate) {
            this.childEnv.terminate();
        }
    }
}