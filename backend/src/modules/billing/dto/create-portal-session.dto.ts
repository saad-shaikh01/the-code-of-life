import { IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePortalSessionDto {
  @ApiProperty({
    description: 'URL to return to after leaving the billing portal',
    example: 'https://example.com/dashboard',
  })
  @IsUrl()
  returnUrl: string;
}
