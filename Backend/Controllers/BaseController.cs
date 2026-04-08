using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace TodoListApi.Controllers
{
    public class BaseController : ControllerBase
    {
        protected int GetUserId() =>
            int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    }
}