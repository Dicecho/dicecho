import { ClientOptions } from '@elastic/elasticsearch';
import { ModuleMetadata, Type } from '@nestjs/common/interfaces';

export interface IBasicSearchQuery {
  keyword: string;
  pageSize: number;
  page: number;
}

export interface SearchModuleOptions extends ClientOptions {
  enabled: boolean;
};

export interface SearchOptionsFactory {
  createSearchOptions():
    | Promise<SearchModuleOptions>
    | SearchModuleOptions;
}

export interface SearchModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<SearchOptionsFactory>;
  useClass?: Type<SearchOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<SearchModuleOptions> | SearchModuleOptions;
  inject?: any[];
}