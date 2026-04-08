using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TodoListApi.Data;
using TodoListApi.DTOs;
using TodoListApi.Models;

namespace TodoListApi.Services
{
    public class TaskService : ITaskService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IMapper _mapper;

        public TaskService(AppDbContext context, IConfiguration configuration, IMapper mapper)
        {
            _context = context;
            _configuration = configuration;
            _mapper = mapper;
        }
        public async Task<TaskResponseDto> CreateTask(CreateTaskDto dto, int userId)
        {
            var taskEntity = _mapper.Map<TaskItem>(dto);
            taskEntity.UserId = userId;
            taskEntity.CreatedAt = DateTime.UtcNow;

            _context.Tasks.Add(taskEntity);
            await _context.SaveChangesAsync();

            return _mapper.Map<TaskResponseDto>(taskEntity);
        }

        public async Task<List<TaskResponseDto>> GetAllTasks(int userId)
        {
            var tasks = await _context.Tasks
                .Where(t => t.UserId == userId)
                .ToListAsync();
            return _mapper.Map<List<TaskResponseDto>>(tasks);
        }

        public async Task<TaskResponseDto> GetTaskById(int id, int userId)
        {
            var task = await _context.Tasks
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

            throw new KeyNotFoundException("Task not found");

            return _mapper.Map<TaskResponseDto>(task);
        }

        public async Task<TaskResponseDto> UpdateTask(int id, UpdateTaskDto dto, int userId)
        {
            var existingTask = await _context.Tasks
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

            if (existingTask == null) return null;

            _mapper.Map(dto, existingTask);

            await _context.SaveChangesAsync();

            return _mapper.Map<TaskResponseDto>(existingTask);
        }

        public async Task DeleteTask(int id, int userId)
        {
            var task = await _context.Tasks
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
            if (task == null)
                throw new KeyNotFoundException("Task not found");
            _context.Tasks.Remove(task);
            await _context.SaveChangesAsync();
        }

        public async Task MarkComplete(int id, int userId)
        {
            var task = await _context.Tasks
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
            if (task == null)
                throw new KeyNotFoundException("Task not found");
            task.IsCompleted = true;
            await _context.SaveChangesAsync();
        }
    }
}
