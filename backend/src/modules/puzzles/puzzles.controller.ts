import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UsePipes,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import { PuzzlesService } from './puzzles.service';
import { DecoderService } from './decoder.service';
import {
  CreatePuzzleDto,
  UpdatePuzzleDto,
  createPuzzleSchema,
  updatePuzzleSchema,
  CreatePuzzleInput,
  UpdatePuzzleInput,
} from './schemas/puzzle.schema';
import { PuzzleQueryDto, puzzleQuerySchema } from './schemas/puzzle-query.schema';
import {
  DecodeRequestDto,
  EncodeRequestDto,
  ValidateAttemptDto,
  DecodeResultDto,
  ValidationResultDto,
  decodeRequestSchema,
  encodeRequestSchema,
  validateAttemptSchema,
  DecodeResult,
  ValidationResult,
} from './schemas/decoder.schema';
import { ApiResponseDto, PaginatedResponseDto } from '../../common/dto';
import { Puzzle } from '@prisma/client';

@ApiTags('puzzles')
@Controller('puzzles')
@UsePipes(ZodValidationPipe)
export class PuzzlesController {
  constructor(
    private readonly puzzlesService: PuzzlesService,
    private readonly decoderService: DecoderService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new puzzle' })
  @ApiResponse({
    status: 201,
    description: 'Puzzle created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(
    @Body() createPuzzleDto: CreatePuzzleDto,
  ): Promise<ApiResponseDto<Puzzle>> {
    const puzzle = await this.puzzlesService.create(
      createPuzzleDto as CreatePuzzleInput,
    );
    return ApiResponseDto.success(puzzle, 'Puzzle created successfully');
  }

  @Get()
  @ApiOperation({ summary: 'Get all puzzles with pagination and filtering' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of puzzles',
  })
  async findAll(
    @Query() query: PuzzleQueryDto,
  ): Promise<PaginatedResponseDto<Puzzle>> {
    const { puzzles, total } = await this.puzzlesService.findAll(query);
    return new PaginatedResponseDto(
      puzzles,
      total,
      query.page ?? 1,
      query.limit ?? 10,
    );
  }

  @Get('daily')
  @ApiOperation({ summary: "Get today's daily puzzle" })
  @ApiResponse({
    status: 200,
    description: "Returns today's daily puzzle or null if not available",
  })
  async findDaily(): Promise<ApiResponseDto<Puzzle | null>> {
    const puzzle = await this.puzzlesService.findDailyPuzzle();
    return ApiResponseDto.success(puzzle);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a puzzle by ID' })
  @ApiParam({ name: 'id', description: 'Puzzle ID' })
  @ApiResponse({ status: 200, description: 'Returns the puzzle' })
  @ApiResponse({ status: 404, description: 'Puzzle not found' })
  async findOne(@Param('id') id: string): Promise<ApiResponseDto<Puzzle>> {
    const puzzle = await this.puzzlesService.findOne(id);
    return ApiResponseDto.success(puzzle);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a puzzle' })
  @ApiParam({ name: 'id', description: 'Puzzle ID' })
  @ApiResponse({ status: 200, description: 'Puzzle updated successfully' })
  @ApiResponse({ status: 404, description: 'Puzzle not found' })
  async update(
    @Param('id') id: string,
    @Body() updatePuzzleDto: UpdatePuzzleDto,
  ): Promise<ApiResponseDto<Puzzle>> {
    const puzzle = await this.puzzlesService.update(
      id,
      updatePuzzleDto as UpdatePuzzleInput,
    );
    return ApiResponseDto.success(puzzle, 'Puzzle updated successfully');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a puzzle' })
  @ApiParam({ name: 'id', description: 'Puzzle ID' })
  @ApiResponse({ status: 200, description: 'Puzzle deleted successfully' })
  @ApiResponse({ status: 404, description: 'Puzzle not found' })
  async remove(@Param('id') id: string): Promise<ApiResponseDto<Puzzle>> {
    const puzzle = await this.puzzlesService.remove(id);
    return ApiResponseDto.success(puzzle, 'Puzzle deleted successfully');
  }
}

@ApiTags('decoder')
@Controller('decoder')
@UsePipes(ZodValidationPipe)
export class DecoderController {
  constructor(
    private readonly decoderService: DecoderService,
    private readonly puzzlesService: PuzzlesService,
  ) {}

  @Post('decode')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Decode an encrypted pattern to readable text' })
  @ApiResponse({
    status: 200,
    description: 'Returns decoded text with statistics',
    type: DecodeResultDto,
  })
  decode(
    @Body() decodeRequest: DecodeRequestDto,
  ): ApiResponseDto<DecodeResult> {
    const result = this.decoderService.decode(
      decodeRequest.encryptedPattern,
      decodeRequest.customMap,
    );
    return ApiResponseDto.success(result);
  }

  @Post('encode')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Encode plain text to symbols' })
  @ApiResponse({
    status: 200,
    description: 'Returns encoded pattern with statistics',
    type: DecodeResultDto,
  })
  encode(
    @Body() encodeRequest: EncodeRequestDto,
  ): ApiResponseDto<DecodeResult> {
    const result = this.decoderService.encode(
      encodeRequest.text,
      encodeRequest.customMap,
    );
    return ApiResponseDto.success(result);
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Validate a user's decode attempt against a puzzle" })
  @ApiResponse({
    status: 200,
    description: 'Returns validation result with similarity score',
    type: ValidationResultDto,
  })
  @ApiResponse({ status: 404, description: 'Puzzle not found' })
  async validate(
    @Body() validateRequest: ValidateAttemptDto,
  ): Promise<ApiResponseDto<ValidationResult>> {
    const puzzle = await this.puzzlesService.findOne(validateRequest.puzzleId);

    const isCorrect = this.decoderService.validateAttempt(
      validateRequest.attempt,
      puzzle.originalReflection,
      validateRequest.caseSensitive,
    );

    const similarity = this.decoderService.calculateSimilarity(
      validateRequest.attempt,
      puzzle.originalReflection,
    );

    const result: ValidationResult = {
      isCorrect,
      similarity,
      hint: !isCorrect && puzzle.hints?.length ? puzzle.hints[0] : undefined,
    };

    return ApiResponseDto.success(result);
  }

  @Get('symbol-map')
  @ApiOperation({ summary: 'Get the default symbol mapping' })
  @ApiResponse({
    status: 200,
    description: 'Returns the default symbol-to-text mapping',
  })
  getSymbolMap(): ApiResponseDto<Record<string, string>> {
    const symbolMap = this.decoderService.getDefaultSymbolMap();
    return ApiResponseDto.success(symbolMap);
  }
}
