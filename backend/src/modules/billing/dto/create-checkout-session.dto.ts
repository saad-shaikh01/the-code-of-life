import { IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCheckoutSessionDto {
  @ApiProperty({
    description: 'Stripe Price ID for the subscription plan',
    example: 'price_1ABC123',
  })
  @IsString()
  priceId: string;

  @ApiProperty({
    description: 'URL to redirect to after successful checkout',
    example: 'https://example.com/success',
  })
  @IsUrl()
  successUrl: string;

  @ApiProperty({
    description: 'URL to redirect to if checkout is cancelled',
    example: 'https://example.com/cancel',
  })
  @IsUrl()
  cancelUrl: string;
}
