import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Comment as CommentDocument } from './comment.schema';

export interface ICommentable extends Document {
  commentCount: number;
  lastCommentedAt: Date;
}
