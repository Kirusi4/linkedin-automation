import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  linkedinPostId: string;

  @Column()
  imagePath: string;

  @Column('text')
  content: string;

  @Column({ default: 'pending' })
  status: 'pending' | 'success' | 'failed';

  @Column({ type: 'text', nullable: true })
  errorLog: string;

  @CreateDateColumn()
  createdAt: Date;
}
