import { Injectable } from "@nestjs/common";
import { UsersRepository } from "../../core/repositories/users.repository";
import { RegisterDto } from "../auth/dto/request";
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {

  constructor(private readonly userRepository: UsersRepository) { }

  async getUser(id: string) {
    return await this.userRepository.findById(id);
  }

  async createUser(registerDto: RegisterDto) {
    const hashPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this.userRepository.create({ ...registerDto, password_hash: hashPassword });
    const savedUser = await this.userRepository.save(user);
    const { password_hash, ...result } = savedUser;
    return result;
  }

  async findUserByEmail(email: string) {
    return await this.userRepository.findOneByWhere({ email });
  }
  async findUserByEmailWithPassword(email: string) {
    return await this.userRepository.findByEmailWithPassword(email);
  }

  async findById(id: string) {
    return await this.userRepository.findById(id);
  }
}