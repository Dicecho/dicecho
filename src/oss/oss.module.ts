
import { Module, Global, DynamicModule } from '@nestjs/common';
import { OSS_OPTIONS, OSSModuleOptions, OSSModuleAsyncOptions, ossProvider, ossStsProvider } from './oss.provider';
import { OSSService } from './oss.service';
import tslib from "tslib";

/**
 * oss方法实例化模块
 * @export
 * @class BaseModule
 */
@Global()
@Module({
	imports: [],
	providers: [OSSService],
	exports: [OSSService]
})
export class OSSModule {
    public static forRoot(options: OSSModuleOptions): DynamicModule {

        return {
            module: OSSModule,
            providers: [
                ossProvider(),
                ossStsProvider(),
                { provide: OSS_OPTIONS, useValue: options }
            ],
            exports: [OSSService]
        };
    }

    public static forRootAsync(options: OSSModuleAsyncOptions): DynamicModule {
        return {
            module: OSSModule,
            imports: options.imports || [],
            providers: [
                ossProvider(),
                ossStsProvider(),
                ...this.createAsyncProviders(options), 
            ],
        };
    }

    static createAsyncProviders(options: OSSModuleAsyncOptions) {
        if (options.useExisting || options.useFactory) {
            return [this.createAsyncOptionsProvider(options)];
        }
        return [
            this.createAsyncOptionsProvider(options),
            {
                provide: options.useClass,
                useClass: options.useClass,
            }
        ];
    }

    static createAsyncOptionsProvider(options: OSSModuleAsyncOptions) {
        if (options.useFactory) {
            return {
                provide: OSS_OPTIONS,
                useFactory: options.useFactory,
                inject: options.inject || []
            };
        }
        return {
            provide: OSS_OPTIONS,
            useFactory: (optionsFactory) => tslib.__awaiter(this, void 0, void 0, function* () { return yield optionsFactory.createJwtOptions(); }),
            inject: [options.useExisting || options.useClass]
        };
    }
}
