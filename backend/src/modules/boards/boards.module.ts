import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Board } from './entities/board.entity';
import { Post } from './entities/post.entity';
import { BoardsService } from './boards.service';
import { PostsService } from './posts.service';
import { BoardsController } from './boards.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Board, Post])],
  controllers: [BoardsController],
  providers: [BoardsService, PostsService],
  exports: [BoardsService],
})
export class BoardsModule {}
