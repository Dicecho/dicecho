import { Test, TestingModule } from '@nestjs/testing';
import { RichtextService } from './richtext.service';

describe('RichtextService', () => {
  let service: RichtextService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RichtextService],
    }).compile();

    service = module.get<RichtextService>(RichtextService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
