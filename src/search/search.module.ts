import { Module, DynamicModule, Provider, Global } from '@nestjs/common';
import { SearchModuleAsyncOptions, SearchOptionsFactory, SearchModuleOptions } from './search.interface';
import { SearchService } from './search.services';
import { SEARCH_MODULE_OPTIONS } from './search.contants';

@Global()
@Module({
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {
  static register(options: SearchModuleOptions): DynamicModule {
    return {
      module: SearchModule,
      providers: [{ provide: SEARCH_MODULE_OPTIONS, useValue: options }]
    };
  }

  static registerAsync(options: SearchModuleAsyncOptions): DynamicModule {
    return {
      module: SearchModule,
      imports: options.imports || [],
      providers: [...this.createAsyncProviders(options)],
    };
  }

  private static createAsyncProviders(
    options: SearchModuleAsyncOptions,
  ): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }
    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: options.useClass,
        useClass: options.useClass,
      },
    ];
  }

  private static createAsyncOptionsProvider(
    options: SearchModuleAsyncOptions,
  ): Provider {
    if (options.useFactory) {
      return {
        provide: SEARCH_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }
    return {
      provide: SEARCH_MODULE_OPTIONS,
      useFactory: async (optionsFactory: SearchOptionsFactory) =>
        await optionsFactory.createSearchOptions(),
      inject: [options.useExisting || options.useClass],
    };
  }
}
