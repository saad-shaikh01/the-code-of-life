import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  Headers,
  RawBodyRequest,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { CreatePortalSessionDto } from './dto/create-portal-session.dto';

interface AuthenticatedRequest extends Request {
  user: { id: string; userId?: string };
}

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('checkout-session')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a Stripe checkout session for subscription' })
  async createCheckoutSession(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateCheckoutSessionDto,
  ) {
    return this.billingService.createCheckoutSession(
      req.user.id,
      dto.priceId,
      dto.successUrl,
      dto.cancelUrl,
    );
  }

  @Post('portal-session')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a Stripe billing portal session' })
  async createPortalSession(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreatePortalSessionDto,
  ) {
    return this.billingService.createPortalSession(
      req.user.id,
      dto.returnUrl,
    );
  }

  @Get('subscription')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user subscription' })
  async getSubscription(@Req() req: AuthenticatedRequest) {
    return this.billingService.getSubscription(req.user.id);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Handle Stripe webhook events' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const payload = req.rawBody;
    if (!payload) {
      throw new Error('No raw body available');
    }
    return this.billingService.handleWebhookEvent(payload, signature);
  }
}
