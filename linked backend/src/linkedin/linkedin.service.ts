import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as fs from 'fs-extra';

@Injectable()
export class LinkedInService {
    private readonly logger = new Logger(LinkedInService.name);
    private readonly token: string;
    private readonly baseUrl: string;
    private readonly personId: string;

    private readonly apiVersion = '202602';

    constructor(private configService: ConfigService) {
        this.token = this.configService.get<string>('LINKEDIN_TOKEN') as string;
        this.baseUrl = 'https://api.linkedin.com/rest'; // Modern base URL
        this.personId = this.configService.get<string>('LINKEDIN_PERSON_ID') as string;
    }

    async createPostWithImage(imagePath: string, text: string) {
        try {
            this.logger.log(`Starting post creation for image: ${imagePath}`);

            // 1. Initialize Image Upload
            this.logger.log('Initializing image upload...');
            const uploadData = await this.initializeImageUpload();
            this.logger.log(`Upload initialization data: ${JSON.stringify(uploadData)}`);
            const imageUrn = uploadData.value.image;
            const uploadUrl = uploadData.value.uploadUrl;

            // 2. Upload Image
            this.logger.log(`Uploading image from: ${imagePath}`);
            await this.uploadImage(uploadUrl, imagePath);

            // 3. Wait for image to be processed
            this.logger.log(`Waiting for image ${imageUrn} to be AVAILABLE...`);
            await this.waitForImageToBeAvailable(imageUrn);

            // 4. Create Post
            this.logger.log(`Creating post with image Urn: ${imageUrn}`);
            const postResponse = await this.createPost(imageUrn, text);

            this.logger.log(`Successfully posted to LinkedIn. Post ID: ${postResponse.id}`);
            return postResponse.id;
        } catch (error) {
            this.logger.error('Failed to create LinkedIn post', error.response?.data || error.message);
            throw error;
        }
    }

    private async initializeImageUpload() {
        const url = `${this.baseUrl}/images?action=initializeUpload`;
        const body = {
            initializeUploadRequest: {
                owner: this.personId,
            },
        };

        const response = await axios.post(url, body, {
            headers: {
                Authorization: `Bearer ${this.token}`,
                'LinkedIn-Version': this.apiVersion,
                'X-Restli-Protocol-Version': '2.0.0',
            },
        });

        return response.data;
    }

    private async uploadImage(uploadUrl: string, imagePath: string) {
        const imageBuffer = await fs.readFile(imagePath);
        await axios.put(uploadUrl, imageBuffer, {
            headers: {
                'Content-Type': 'application/octet-stream',
            },
        });
    }

    private async waitForImageToBeAvailable(imageUrn: string) {
        const maxTries = 10;
        const delay = 3000;
        const url = `${this.baseUrl}/images/${imageUrn}`;

        for (let i = 0; i < maxTries; i++) {
            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${this.token}`,
                    'LinkedIn-Version': this.apiVersion,
                },
            });

            const status = response.data.status;
            this.logger.log(`Image ${imageUrn} status: ${status}`);

            if (status === 'AVAILABLE') {
                return;
            }

            if (status === 'PROCESSING_FAILED') {
                throw new Error('Image processing failed on LinkedIn');
            }

            await new Promise(resolve => setTimeout(resolve, delay));
        }

        throw new Error('Timeout waiting for image to be available');
    }

    private async createPost(imageUrn: string, text: string) {
        const url = `${this.baseUrl}/posts`;
        const body = {
            author: this.personId,
            commentary: text,
            visibility: 'PUBLIC',
            distribution: {
                feedDistribution: 'MAIN_FEED',
                targetEntities: [],
                thirdPartyDistributionChannels: [],
            },
            content: {
                media: {
                    title: 'Tech Update',
                    id: imageUrn,
                },
            },
            lifecycleState: 'PUBLISHED',
        };

        const response = await axios.post(url, body, {
            headers: {
                Authorization: `Bearer ${this.token}`,
                'LinkedIn-Version': this.apiVersion,
                'X-Restli-Protocol-Version': '2.0.0',
            },
        });

        // The new posts API returns the ID in the x-linkedin-id header, but axios response.data might have it or not depending on the status code.
        // Usually it returns 201 Created.
        return { id: response.headers['x-restli-id'] || response.data?.id };
    }
}
