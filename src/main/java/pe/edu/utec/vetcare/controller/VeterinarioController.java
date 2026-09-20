package pe.edu.utec.vetcare.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.edu.utec.vetcare.dto.request.CreateVeterinarioRequest;
import pe.edu.utec.vetcare.dto.request.UpdateVeterinarioRequest;
import pe.edu.utec.vetcare.dto.response.VeterinarioResponse;
import pe.edu.utec.vetcare.service.VeterinarioService;

import java.util.List;

@RestController
@RequestMapping("/api/veterinarios")
public class VeterinarioController {

    private final VeterinarioService veterinarioService;

    public VeterinarioController(VeterinarioService veterinarioService) {
        this.veterinarioService = veterinarioService;
    }

    @GetMapping
    public List<VeterinarioResponse> getAll() {
        return veterinarioService.getAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<VeterinarioResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(veterinarioService.getById(id));
    }

    @PostMapping
    public ResponseEntity<VeterinarioResponse> create(@Valid @RequestBody CreateVeterinarioRequest request) {
        VeterinarioResponse veterinarioCreated = veterinarioService.create(request);
        return ResponseEntity.ok(veterinarioCreated);
    }

    @PutMapping("/{id}")
    public ResponseEntity<VeterinarioResponse> update(
            @PathVariable Long id,
            @Valid
            @RequestBody
            UpdateVeterinarioRequest request) {

        VeterinarioResponse veterinarioUpdated = veterinarioService.update(id, request);
        return ResponseEntity.ok(veterinarioUpdated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        veterinarioService.delete(id);
        return ResponseEntity.noContent().build();
    }
}