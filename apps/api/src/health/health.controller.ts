import { Controller, Get } from "@nestjs/common";
import { HealthService } from "./health.service";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
@Controller("health")
@ApiTags("Health")
export class HealthController {
      constructor(private readonly healthService: HealthService) {}
      @Get("ready")
      @ApiOperation({ summary: "Check if the API is ready", description: "Check if the API is ready" })
      ready() {
            return this.healthService.checkReady();
      }
}
