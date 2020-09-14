import { Feature, Service, Environment, COM, Config, TopLevelConfig, Slot } from '@wixc3/engine-core';
import type { ApplicationProxyService } from '../src/application-proxy-service';
import type { LaunchEnvironmentMode, TopLevelConfigProvider } from '@wixc3/engine-scripts';
import { cwd } from 'process';
import type webpack from 'webpack';

export const devServerEnv = new Environment('dev-server', 'node', 'single');

export interface DevServerConfig {
    httpServerPort: number;
    featureName?: string;
    singleFeature?: boolean;
    configName?: string;
    publicPath?: string;
    title?: string;
    publicConfigsRoute: string;
    singleRun: boolean;
    inspect: boolean;
    autoLaunch: boolean;
    nodeEnvironmentsMode?: LaunchEnvironmentMode;
    basePath: string;
    mode: 'production' | 'development';
    overrideConfig: TopLevelConfig | TopLevelConfigProvider;
    defaultRuntimeOptions: Record<string, string | boolean>;
}

export interface DevServerActions {
    close: () => Promise<void>;
}

export interface ServerListeningParams {
    port: number;
    host: string;
}

export type ServerListeningHandler =
    | ((params: ServerListeningParams) => void)
    | ((params: ServerListeningParams) => Promise<void>);

export default new Feature({
    id: 'buildFeature',
    dependencies: [COM],
    api: {
        /**
         * service providing application level behavior and info, such as node env management, feature detection etc
         */
        application: Service.withType<ApplicationProxyService>().defineEntity(devServerEnv).allowRemoteAccess(),
        /**
         * Dev server configuration, will usually be passed in from the cli params
         */
        devServerConfig: new Config<DevServerConfig>({
            httpServerPort: 3000,
            singleFeature: false,
            singleRun: false,
            inspect: false,
            autoLaunch: true,
            basePath: cwd(),
            mode: 'development',
            overrideConfig: [],
            defaultRuntimeOptions: {},
            publicConfigsRoute: 'configs/',
        }),
        /**
         * a slot for registering callback that will be called when the devserver is listening
         */
        serverListeningHandlerSlot: Slot.withType<ServerListeningHandler>().defineEntity(devServerEnv),
        /**
         * A slot from registering webpack configs for different dashboards
         */
        engineerWebpackConfigs: Slot.withType<webpack.Configuration>().defineEntity(devServerEnv),
        /**
         * Actions that can be performed on the dev server, currently only close
         */
        devServerActions: Service.withType<DevServerActions>().defineEntity(devServerEnv),
    },
});
