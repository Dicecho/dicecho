
   
import { Client } from '@elastic/elasticsearch';
import { Inject, Injectable, Optional } from '@nestjs/common';
import { SEARCH_MODULE_OPTIONS } from './search.contants';
import { SearchModuleOptions } from './search.interface';
import { NotSupprtException } from './search.exception';


@Injectable()
export class SearchService {
  private client: Client = null;
  constructor(
    @Optional()
    @Inject(SEARCH_MODULE_OPTIONS) 
    private options: SearchModuleOptions,
  ) {}

  getClient() {
    if (this.client) {
      return this.client;
    }

    this.client = new Client(this.options); 
    return this.client
  }

  search(...args) {
    if (!this.options.enabled) {
      throw new NotSupprtException('this domain not support search engine')
    }
    return this.getClient().search(...args);
  }
}