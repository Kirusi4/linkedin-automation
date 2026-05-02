import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(private configService: ConfigService) { }

    getAuthorizationUrl(): string {
        const clientId = this.configService.get<string>('LINKEDIN_CLIENT_ID') as string;
        const redirectUri = this.configService.get<string>('LINKEDIN_REDIRECT_URI') as string;
        const scope = 'openid profile w_member_social email'; // Added w_member_social for posting

        return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=DCEEFWF45453sdffef424&scope=${encodeURIComponent(scope)}`;
    }

    async getAccessToken(code: string) {
        const clientId = this.configService.get<string>('LINKEDIN_CLIENT_ID') as string;
        const clientSecret = this.configService.get<string>('LINKEDIN_CLIENT_SECRET') as string;
        const redirectUri = this.configService.get<string>('LINKEDIN_REDIRECT_URI') as string;

        const url = 'https://www.linkedin.com/oauth/v2/accessToken';
        const params = new URLSearchParams();
        params.append('grant_type', 'authorization_code');
        params.append('code', code);
        params.append('redirect_uri', redirectUri);
        params.append('client_id', clientId);
        params.append('client_secret', clientSecret);

        try {
            const response = await axios.post(url, params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            return response.data;
        } catch (error) {
            this.logger.error('Failed to exchange code for token', error.response?.data || error.message);
            throw error;
        }
    }

    async getProfile(accessToken: string) {
        try {
            const response = await axios.get('https://api.linkedin.com/v2/userinfo', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            // The URN format usually looks like urn:li:person:XXXX
            // In the new OIDC userinfo endpoint, sub is the unique identifier
            return response.data;
        } catch (error) {
            this.logger.error('Failed to fetch profile info', error.response?.data || error.message);
            throw error;
        }
    }
}
