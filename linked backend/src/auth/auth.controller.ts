import { Controller, Get, Query, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Get('linkedin')
    redirectToLinkedIn(@Res() res: Response) {
        const url = this.authService.getAuthorizationUrl();
        res.redirect(url);
    }

    @Get('linkedin/callback')
    async handleCallback(@Query('code') code: string) {
        if (!code) {
            return { error: 'No code provided' };
        }

        try {
            const tokenData = await this.authService.getAccessToken(code);
            const profile = await this.authService.getProfile(tokenData.access_token);

            return {
                message: 'LinkedIn Authentication Successful!',
                details: {
                    instructions: 'Copy the following values to your .env file',
                    LINKEDIN_TOKEN: tokenData.access_token,
                    LINKEDIN_PERSON_ID: `urn:li:person:${profile.sub}`,
                    expires_in: tokenData.expires_in,
                },
                raw_profile: profile
            };
        } catch (error) {
            return { error: 'Authentication failed', message: error.message };
        }
    }
}
