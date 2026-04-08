using AutoMapper;
using TodoListApi.DTOs;
using TodoListApi.Models;
public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<TaskItem, TaskResponseDto>();

        CreateMap<CreateTaskDto, TaskItem>();

        // both sides

        CreateMap<UpdateTaskDto, TaskItem>().ReverseMap();
    }
}