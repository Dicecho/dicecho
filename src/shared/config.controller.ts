import { Controller, Get } from '@nestjs/common';
import { Public } from '@app/auth/decorators/public.decorator';
import { SharedService } from './shared.service';
import { configKeys, DEFAULT_BANNER } from './constants';

@Controller('config')
export class ConfigController {
  constructor(
    private sharedService: SharedService,
  ) {}
  
  @Public()
  @Get('event')
  async event() {
    const result = await this.sharedService.configModel.findOne({ key: configKeys.EVENT })
    if (!result) { 
      return []
    }

    const data = [...result.value].sort((a, b) => a.priority - b.priority)

    return data
  }

  @Public()
  @Get('banner')
  async banner() {
    const result = await this.sharedService.configModel.findOne({ key: configKeys.BANNER })
    if (!result) { 
      return [DEFAULT_BANNER]
    }

    const data = [...result.value].sort((a, b) => a.priority - b.priority)

    return data
  }
}
