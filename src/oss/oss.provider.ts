import { ModuleMetadata, Type } from '@nestjs/common/interfaces';
import OSS from 'ali-oss';

export const OSS_CONST = Symbol('OSS');
export const OSS_STS = Symbol('OSS_STS');
export const OSS_OPTIONS = Symbol('OSS_OPTIONS');

export interface OSSModuleOptions {
    client: OSS.Options;
    domain?: string;
    filePrefix?: string;
    multi?: boolean;
    workers?: number;
}

export interface OSSOptionsFactory {
    createJwtOptions(): Promise<OSSModuleOptions> | OSSModuleOptions;
}

export interface OSSModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
    useExisting?: Type<OSSOptionsFactory>;
    useClass?: Type<OSSOptionsFactory>;
    useFactory?: (...args: any[]) => Promise<OSSModuleOptions> | OSSModuleOptions;
    inject?: any[];
}


export const ossProvider = () => ({
    provide: OSS_CONST,
    useFactory: (options: OSSModuleOptions) => {
        return new OSS(options.client);
    },
    inject: [OSS_OPTIONS]
});


export const ossStsProvider = () => ({
    provide: OSS_STS,
    useFactory: (options: OSSModuleOptions) => {
        return new OSS.STS({
            accessKeyId: 'LTAI4G8GdJTJJCh38y1Kng1e',
            accessKeySecret: 'vWVDeLQ5OflZwylaCxJoee7owstgEy',
        });
    },
    inject: [OSS_OPTIONS]
});
