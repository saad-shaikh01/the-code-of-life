import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma';
import { PuzzlesModule } from './modules/puzzles';
import { AuthModule } from './modules/auth';
import { UsersModule } from './modules/users';
import { ProgressModule } from './modules/progress';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),

    // Database
    PrismaModule,

    // Feature modules
    AuthModule,
    UsersModule,
    ProgressModule,
    PuzzlesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
