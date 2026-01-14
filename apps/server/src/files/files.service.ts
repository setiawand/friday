import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File } from '../entities/file.entity';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(File)
    private fileRepo: Repository<File>,
  ) {}

  async getFiles(itemId: string) {
    return this.fileRepo.find({
      where: { item_id: itemId },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
  }

  async createFile(data: Partial<File>) {
    const file = this.fileRepo.create(data);
    return this.fileRepo.save(file);
  }

  async deleteFile(id: string) {
    return this.fileRepo.delete(id);
  }
}
