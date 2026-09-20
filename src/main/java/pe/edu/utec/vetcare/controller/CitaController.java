package pe.edu.utec.vetcare.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.edu.utec.vetcare.dto.request.CreateCitaRequest;
import pe.edu.utec.vetcare.dto.request.UpdateCitaRequest;
import pe.edu.utec.vetcare.dto.response.CitaResponse;
import pe.edu.utec.vetcare.service.CitaService;

import java.util.List;

@RestController
@RequestMapping("/api/citas")
public class CitaController {

    private final CitaService citaService;

    public CitaController(CitaService citaService) {
        this.citaService = citaService;
    }

    @GetMapping
    public ResponseEntity<List<CitaResponse>> getAll() {
        return ResponseEntity.ok(citaService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CitaResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(citaService.getById(id));
    }

    @PostMapping
    public ResponseEntity<CitaResponse> create(@Valid @RequestBody CreateCitaRequest request) {
        return ResponseEntity.ok(citaService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CitaResponse> update(@PathVariable Long id,
            @Valid @RequestBody UpdateCitaRequest request) {
        return ResponseEntity.ok(citaService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        citaService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/confirmar")
    public ResponseEntity<CitaResponse> confirm(@PathVariable Long id) {
        return ResponseEntity.ok(citaService.confirm(id));
    }

    @PutMapping("/{id}/cancelar")
    public ResponseEntity<CitaResponse> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(citaService.cancel(id));
    }

    @PutMapping("/{id}/atender")
    public ResponseEntity<CitaResponse> attend(@PathVariable Long id) {
        return ResponseEntity.ok(citaService.attend(id));
    }
}