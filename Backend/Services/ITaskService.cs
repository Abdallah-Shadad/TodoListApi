using TodoListApi.DTOs;

namespace TodoListApi.Services
{
    public interface ITaskService
    {
        Task<List<TaskResponseDto>> GetAllTasks(int userId);
        Task<TaskResponseDto> GetTaskById(int id, int userId);
        Task<TaskResponseDto> CreateTask(CreateTaskDto dto, int userId);
        Task<TaskResponseDto> UpdateTask(int id, UpdateTaskDto dto, int userId);
        Task MarkComplete(int id, int userId);
        Task DeleteTask(int id, int userId);
    }
}
