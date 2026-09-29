using Microsoft.AspNetCore.Mvc;
using ResourceHub.Server.DTOs;
using ResourceHub.Server.Services;

namespace ResourceHub.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;

        public AuthController(AuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            var response = await _authService.LoginAsync(loginDto);
            if (response.Data == null)
            {
                return Unauthorized(response);
            }
            return Ok(response);
        }

        [HttpPost("seed-admin")]
        public async Task<IActionResult> SeedAdmin()
        {
            var response = await _authService.SeedAdminAsync();
            return Ok(response);
        }
    }
}
