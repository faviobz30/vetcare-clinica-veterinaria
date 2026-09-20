package pe.edu.utec.vetcare.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.edu.utec.vetcare.dto.request.CreateAtencionRequest;
import pe.edu.utec.vetcare.dto.request.UpdateAtencionRequest;
import pe.edu.utec.vetcare.dto.response.AtencionResponse;
import pe.edu.utec.vetcare.service.AtencionService;

import java.util.List;

@RestController
@RequestMapping("/api/atenciones")
public class AtencionController {

    private final AtencionService atencionService;

    public AtencionController(AtencionService atencionService) {
        this.atencionService = atencionService;
    }

    @GetMapping
    public ResponseEntity<List<AtencionResponse>> getAll() {
        return ResponseEntity.ok(atencionService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AtencionResponse> getById(
            @PathVariable Integer id
    ) {
        return ResponseEntity.ok(atencionService.getById(id));
    }

    @PostMapping
    public ResponseEntity<AtencionResponse> create(
            @Valid @RequestBody CreateAtencionRequest request
    ) {
        return ResponseEntity.ok(atencionService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AtencionResponse> update(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateAtencionRequest request
    ) {
        return ResponseEntity.ok(atencionService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Integer id
    ) {
        atencionService.delete(id);
        return ResponseEntity.noContent().build();
    }
}