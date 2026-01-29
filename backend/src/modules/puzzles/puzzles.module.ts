import { Module } from '@nestjs/common';
import { PuzzlesController, DecoderController } from './puzzles.controller';
import { PuzzlesService } from './puzzles.service';
import { DecoderService } from './decoder.service';

@Module({
  controllers: [PuzzlesController, DecoderController],
  providers: [PuzzlesService, DecoderService],
  exports: [PuzzlesService, DecoderService],
})
export class PuzzlesModule {}
