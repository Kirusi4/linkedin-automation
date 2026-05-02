import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Post as PostEntity } from '../post/post.entity';
import { LinkedInService } from '../linkedin/linkedin.service';
import * as fs from 'fs-extra';
import * as path from 'path';

@Injectable()
export class AutomationService implements OnModuleInit {
    private readonly logger = new Logger(AutomationService.name);

    constructor(
        private configService: ConfigService,
        private linkedinService: LinkedInService,
        @InjectRepository(PostEntity)
        private postRepository: Repository<PostEntity>,
    ) { }

    private readonly postTemplates = [
        "Excited to share some new insights into the ever-evolving world of technology! 🚀 Continuous learning is key to staying ahead in this industry.",
        "Deep diving into some fascinating technical resources today. 💻 The more I explore, the more I realize how much innovation is shaping our future.",
        "Fueling my passion for tech with some great materials. 📈 Knowledge sharing is what drives our community forward!",
        "Reflecting on the impact of modern programming practices. 🛠️ It's amazing to see how tools and methodologies evolve to solve complex problems.",
        "Stay curious and keep building! 🏗️ Today's exploration into tech resources has been incredibly productive.",
    ];

    async onModuleInit() {
        const postOnBoot = this.configService.get<string>('POST_ON_BOOT') === 'true';
        if (postOnBoot) {
            this.logger.log('POST_ON_BOOT is enabled. Triggering immediate post...');
            // Wait a small delay for DB and modules to be ready
            setTimeout(() => this.processPost(), 5000);
        }
    }

    // Runs every hour from 09:00 AM to 10:00 PM
    @Cron('0 9-22 * * *')
    async handleCron() {
        this.logger.log('Checking for scheduled tech post...');

        const today = new Date();
        const isEvenDay = today.getDate() % 2 === 0;

        if (!isEvenDay) {
            this.logger.log('Today is an odd day. Skipping post check.');
            return;
        }

        // Check if we already have a successful post for today
        const startOfToday = new Date(today);
        startOfToday.setHours(0, 0, 0, 0);

        const existingPost = await this.postRepository.findOne({
            where: {
                status: 'success',
                createdAt: MoreThan(startOfToday),
            },
        });

        if (existingPost) {
            this.logger.log('A post has already been made successfully today. Skipping.');
            return;
        }

        const currentHour = today.getHours();
        const isLastChance = currentHour === 22;
        const shouldPostNow = isLastChance || Math.random() < 0.25; // 25% chance to post each hour

        if (shouldPostNow) {
            this.logger.log(`Triggering post now.Hour: ${currentHour}, Last Chance: ${isLastChance} `);
            await this.processPost();
        } else {
            this.logger.log(`Decided to wait for a later hour today.Hour: ${currentHour} `);
        }
    }

    async processPost() {
        const imagesPath = this.configService.get<string>('IMAGES_PATH');

        if (!imagesPath) {
            this.logger.error('IMAGES_PATH is not defined in environment variables');
            return;
        }

        try {
            const exists = await fs.pathExists(imagesPath);
            if (!exists) {
                this.logger.error(`Images path does not exist: ${imagesPath} `);
                return;
            }

            const files = await fs.readdir(imagesPath);
            const imageExtensions = ['.jpg', '.jpeg', '.png'];
            const images = files.filter((file: string) =>
                imageExtensions.includes(path.extname(file).toLowerCase())
            );

            if (images.length === 0) {
                this.logger.error(`No images found in path: ${imagesPath} `);
                return;
            }

            // Get all successful posts from DB to see which images were used
            const successfulPosts = await this.postRepository.find({
                where: { status: 'success' },
                select: ['imagePath']
            });
            const usedImageNames = successfulPosts.map(p => path.basename(p.imagePath).toLowerCase());

            // Filter out used images
            const availableImages = images.filter(img => {
                return !usedImageNames.includes(img.toLowerCase());
            });

            if (availableImages.length === 0) {
                this.logger.warn('All images in the directory have already been posted! No new post will be made.');
                return;
            }

            // Select the first available image (sequential instead of random)
            const nextImage = availableImages[0];
            const fullImagePath = path.join(imagesPath, nextImage);

            // Select a professional English template based on the image index or count
            const templateIndex = (usedImageNames.length) % this.postTemplates.length;
            const baseText = this.postTemplates[templateIndex];
            const signature = "\n\nRegards,\nKirushi j";
            const postText = `${baseText}${signature}`;

            // Save to DB initially
            const postRecord = this.postRepository.create({
                imagePath: fullImagePath as string,
                content: postText,
                status: 'pending',
            });
            await this.postRepository.save(postRecord);

            try {
                const linkedinPostId = await this.linkedinService.createPostWithImage(fullImagePath, postText);
                postRecord.linkedinPostId = linkedinPostId;
                postRecord.status = 'success';
                await this.postRepository.save(postRecord);


            } catch (postError) {
                postRecord.status = 'failed';
                postRecord.errorLog = postError.message;
                await this.postRepository.save(postRecord);


            }

        } catch (error) {
            this.logger.error('Error during automation process', error.stack);
        }
    }
}
