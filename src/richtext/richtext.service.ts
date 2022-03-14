import { Injectable } from '@nestjs/common';
import { Node } from 'slate';

@Injectable()
export class RichtextService {

  serializeToText(nodes: Node[]) {
    return nodes.map(n => Node.string(n)).join('\n')
  }
}
