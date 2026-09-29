using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using ResourceHub.Server.DTOs;
using ResourceHub.Server.Models;
using ResourceHub.Server.Services;

namespace ResourceHub.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ResourcesController : ControllerBase
    {
        private readonly ResourceService _resourceService;

        public ResourcesController(ResourceService resourceService)
        {
            _resourceService = resourceService;
        }

        private string CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        private string CurrentUserName => User.FindFirstValue(ClaimTypes.Name) ?? "User";
        private Role CurrentUserRole => Enum.TryParse<Role>(User.FindFirstValue(ClaimTypes.Role), out var role) ? role : Role.User;

        [HttpGet]
        public async Task<IActionResult> GetMyResources()
        {
            var response = await _resourceService.GetMyResourcesAsync(CurrentUserId);
            return Ok(response);
        }

        [HttpGet("shared")]
        public async Task<IActionResult> GetSharedResources()
        {
            var response = await _resourceService.GetSharedResourcesAsync(CurrentUserId);
            return Ok(response);
        }

        [HttpGet("pending")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetPendingResources()
        {
            var response = await _resourceService.GetPendingResourcesAsync();
            return Ok(response);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var response = await _resourceService.GetByIdAsync(id, CurrentUserId, CurrentUserRole);
            if (response.Data == null)
            {
                return NotFound(response);
            }
            return Ok(response);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromForm] CreateResourceDto dto)
        {
            var response = await _resourceService.CreateResourceAsync(dto, CurrentUserId, CurrentUserName, CurrentUserRole);
            return Ok(response);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromForm] UpdateResourceDto dto)
        {
            var response = await _resourceService.UpdateResourceAsync(id, dto, CurrentUserId, CurrentUserName, CurrentUserRole);
            if (response.Data == null)
            {
                return BadRequest(response);
            }
            return Ok(response);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var response = await _resourceService.DeleteResourceAsync(id, CurrentUserId, CurrentUserRole);
            if (!response.Data)
            {
                return BadRequest(response);
            }
            return Ok(response);
        }

        [HttpPut("{id}/review")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Review(string id, [FromBody] ReviewDto dto)
        {
            var response = await _resourceService.ReviewResourceAsync(id, dto, CurrentUserId, CurrentUserName);
            if (!response.Data)
            {
                return BadRequest(response);
            }
            return Ok(response);
        }

        [HttpPut("{id}/share")]
        public async Task<IActionResult> Share(string id, [FromBody] ShareDto dto)
        {
            var response = await _resourceService.ShareResourceAsync(id, dto, CurrentUserId, CurrentUserRole);
            if (!response.Data)
            {
                return BadRequest(response);
            }
            return Ok(response);
        }

        [HttpGet("{id}/download")]
        public async Task<IActionResult> DownloadAttachment(string id)
        {
            var result = await _resourceService.GetAttachmentStreamAsync(id, CurrentUserId, CurrentUserRole);
            if (result == null)
            {
                return NotFound(new ApiResponse<object> { Message = "Attachment file not found or access denied.", Data = null });
            }

            return File(result.Value.Stream, result.Value.ContentType, result.Value.OriginalFileName);
        }
    }
}
