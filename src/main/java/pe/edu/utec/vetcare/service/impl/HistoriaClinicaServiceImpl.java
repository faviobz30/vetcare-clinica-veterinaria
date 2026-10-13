
package pe.edu.utec.vetcare.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.utec.vetcare.dto.response.HistoriaClinicaResponse;
import pe.edu.utec.vetcare.entity.HistoriaClinicaEntity;
import pe.edu.utec.vetcare.exception.ResourceNotFoundException;
import pe.edu.utec.vetcare.mapper.HistoriaClinicaMapper;
import pe.edu.utec.vetcare.repository.CitaRepository;
import pe.edu.utec.vetcare.repository.HistoriaClinicaRepository;
import pe.edu.utec.vetcare.service.HistoriaClinicaService;

@Service
@RequiredArgsConstructor
public class HistoriaClinicaServiceImpl
        implements HistoriaClinicaService {

    private final HistoriaClinicaRepository repository;
    private final HistoriaClinicaMapper mapper;
    private final CitaRepository citaRepository;

    // Consultar historia clínica por ID
    @Override
    @Transactional(readOnly = true)
    public HistoriaClinicaResponse obtener(Long id) {

        HistoriaClinicaEntity historia = repository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Historia clínica no encontrada"
                        )
                );

        validarAcceso(historia);

        return mapper.toResponse(historia);
    }

    // Consultar historia clínica por ID de mascota
    @Override
    @Transactional(readOnly = true)
    public HistoriaClinicaResponse obtenerPorMascota(
            Long idMascota
    ) {

        HistoriaClinicaEntity historia =
                repository.findByMascotaIdMascota(idMascota)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Historia clínica no encontrada"
                                )
                        );

        validarAcceso(historia);

        return mapper.toResponse(historia);
    }

    // Validar acceso según el usuario autenticado
    private void validarAcceso(HistoriaClinicaEntity historia) {

        Authentication authentication =
                SecurityContextHolder.getContext()
                        .getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()) {

            throw new AccessDeniedException(
                    "No tienes permiso para consultar esta historia clínica"
            );
        }

        String correo = authentication.getName();

        boolean esAdmin = authentication.getAuthorities()
                .stream()
                .anyMatch(a ->
                        a.getAuthority().equals("ROLE_ADMIN")
                );

        boolean esVeterinario = authentication.getAuthorities()
                .stream()
                .anyMatch(a ->
                        a.getAuthority().equals("ROLE_VETERINARIO")
                );

        boolean esPropietario = authentication.getAuthorities()
                .stream()
                .anyMatch(a ->
                        a.getAuthority().equals("ROLE_PROPIETARIO")
                );

        // 1. ADMIN consulta cualquier historia clínica
        if (esAdmin) {
            return;
        }

        Long idMascota = historia.getMascota().getIdMascota();

        // 2. VETERINARIO consulta historias de mascotas
        // que tienen una cita asignada a él
        if (esVeterinario) {

            boolean tieneCitaAsignada = citaRepository
                    .existsByVeterinario_Usuario_CorreoIgnoreCaseAndMascota_IdMascota(
                            correo,
                            idMascota
                    );

            if (tieneCitaAsignada) {
                return;
            }
        }

        // 3. PROPIETARIO consulta solo historias
        // de sus propias mascotas
        if (esPropietario) {

            String correoPropietario = historia
                    .getMascota()
                    .getPropietario()
                    .getUsuario()
                    .getCorreo();

            if (correoPropietario != null
                    && correoPropietario.equalsIgnoreCase(correo)) {
                return;
            }
        }

        // 4. Cualquier otro caso se rechaza
        throw new AccessDeniedException(
                "No tienes permiso para consultar esta historia clínica"
        );
    }
}
